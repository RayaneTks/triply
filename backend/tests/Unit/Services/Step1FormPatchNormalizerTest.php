<?php

namespace Tests\Unit\Services;

use App\Services\Integrations\Step1FormPatchNormalizer;
use PHPUnit\Framework\TestCase;

class Step1FormPatchNormalizerTest extends TestCase
{
    public function test_returns_null_when_raw_not_array(): void
    {
        $this->assertNull(Step1FormPatchNormalizer::normalize('not array', [], []));
        $this->assertNull(Step1FormPatchNormalizer::normalize(null, [], []));
    }

    public function test_returns_null_when_no_valid_fields(): void
    {
        $this->assertNull(Step1FormPatchNormalizer::normalize([], [], []));
        $this->assertNull(Step1FormPatchNormalizer::normalize([
            'departureCity' => 'XX',
            'arrivalCity' => 'YY',
            'travelerCount' => 0,
            'travelDays' => -1,
        ], [], []));
    }

    public function test_normalises_valid_iata_codes_uppercase(): void
    {
        $result = Step1FormPatchNormalizer::normalize([
            'departureCity' => 'cdg',
            'arrivalCity' => '  BCN  ',
        ], [], []);

        $this->assertSame('CDG', $result['departureCity']);
        $this->assertSame('BCN', $result['arrivalCity']);
    }

    public function test_rejects_non_iata_strings(): void
    {
        $result = Step1FormPatchNormalizer::normalize([
            'departureCity' => 'paris',
            'arrivalCity' => 'AB',
        ], [], []);

        $this->assertNull($result);
    }

    public function test_normalises_arrival_city_name_as_string(): void
    {
        $result = Step1FormPatchNormalizer::normalize([
            'arrivalCityName' => '  Barcelone  ',
        ], [], []);

        $this->assertSame('Barcelone', $result['arrivalCityName']);
    }

    public function test_traveler_count_within_1_to_50(): void
    {
        $this->assertNull(Step1FormPatchNormalizer::normalize(['travelerCount' => 0], [], []));
        $this->assertNull(Step1FormPatchNormalizer::normalize(['travelerCount' => 51], [], []));
        $this->assertSame(5, Step1FormPatchNormalizer::normalize(['travelerCount' => 5], [], [])['travelerCount']);
    }

    public function test_dates_must_match_iso_format(): void
    {
        $this->assertNull(Step1FormPatchNormalizer::normalize(['outboundDate' => '01/09/2026'], [], []));

        $result = Step1FormPatchNormalizer::normalize([
            'outboundDate' => '2026-09-01',
            'returnDate' => '2026-09-08',
        ], [], []);
        $this->assertSame('2026-09-01', $result['outboundDate']);
        $this->assertSame('2026-09-08', $result['returnDate']);
    }

    public function test_times_must_match_hh_mm(): void
    {
        $this->assertNull(Step1FormPatchNormalizer::normalize(['outboundDepartureTime' => '25:00'], [], []));

        $result = Step1FormPatchNormalizer::normalize([
            'outboundDepartureTime' => '8:05',
            'outboundArrivalTime' => '23:59',
        ], [], []);
        $this->assertSame('08:05', $result['outboundDepartureTime']);
        $this->assertSame('23:59', $result['outboundArrivalTime']);
    }

    public function test_travel_days_1_to_365(): void
    {
        $this->assertNull(Step1FormPatchNormalizer::normalize(['travelDays' => 0], [], []));
        $this->assertNull(Step1FormPatchNormalizer::normalize(['travelDays' => 366], [], []));
        $this->assertSame(7, Step1FormPatchNormalizer::normalize(['travelDays' => 7], [], [])['travelDays']);
    }

    public function test_selected_options_filtered_against_allow_list(): void
    {
        $allowed = ['Spa', 'Plage', 'Centre ville'];
        $result = Step1FormPatchNormalizer::normalize([
            'selectedOptions' => ['Spa', 'inconnu', 'Plage', 'Spa'],
        ], $allowed, []);

        $this->assertSame(['Spa', 'Plage'], $result['selectedOptions']);
    }

    public function test_dietary_filtered_against_allow_list(): void
    {
        $allowed = ['Végé', 'Vegan'];
        $result = Step1FormPatchNormalizer::normalize([
            'dietarySelections' => ['Vegan', 'Carnivore'],
        ], [], $allowed);

        $this->assertSame(['Vegan'], $result['dietarySelections']);
    }

    public function test_budget_returns_trimmed_string(): void
    {
        $result = Step1FormPatchNormalizer::normalize([
            'budget' => '  2500  ',
        ], [], []);

        $this->assertSame('2500', $result['budget']);
    }
}
